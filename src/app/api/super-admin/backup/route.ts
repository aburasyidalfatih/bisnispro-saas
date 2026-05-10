import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

const BACKUP_DIR = process.env.BACKUP_DIR || "/home/ubuntu/backups"

async function isSuperAdmin() {
  const session = await auth()
  return session?.user?.isSuperAdmin === true
}

// GET — Daftar backup yang tersedia + status
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    // Cek apakah backup directory ada
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json({
        backups: [],
        rcloneInstalled: false,
        gdriveConnected: false,
        lastBackupLog: null,
        diskUsage: null,
      })
    }

    // List file backup lokal
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith("schoolpro_db_") && f.endsWith(".sql.gz"))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f))
        return {
          name: f,
          size: stat.size,
          sizeHuman: formatBytes(stat.size),
          createdAt: stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Cek rclone & Google Drive status
    let rcloneInstalled = false
    let gdriveConnected = false
    try {
      await execAsync("rclone version")
      rcloneInstalled = true
      const { stdout } = await execAsync("rclone listremotes")
      gdriveConnected = stdout.includes("gdrive:")
    } catch { /* not installed */ }

    // Baca log terakhir
    let lastBackupLog = null
    const logFile = path.join(BACKUP_DIR, "backup.log")
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, "utf-8")
      const lines = logContent.trim().split("\n")
      lastBackupLog = lines.slice(-20).join("\n")
    }

    // Hitung total ukuran backup lokal
    const totalSize = files.reduce((acc, f) => acc + f.size, 0)

    // Cek ukuran database
    let dbSize = null
    try {
      const { stdout } = await execAsync(
        `docker compose exec -T db psql -U postgres -d saasmasterpro -t -c "SELECT pg_size_pretty(pg_database_size('saasmasterpro'));"`,
        { cwd: process.env.COMPOSE_DIR || "/home/ubuntu/schoolpro-prod" }
      )
      dbSize = stdout.trim()
    } catch { /* might fail locally */ }

    // Cek crontab
    let cronConfigured = false
    try {
      const { stdout } = await execAsync("crontab -l 2>/dev/null")
      cronConfigured = stdout.includes("backup-db.sh")
    } catch { /* no crontab */ }

    return NextResponse.json({
      backups: files,
      totalBackupSize: formatBytes(totalSize),
      totalBackupCount: files.length,
      rcloneInstalled,
      gdriveConnected,
      cronConfigured,
      lastBackupLog,
      dbSize,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — Trigger backup manual
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action || "backup"

  if (action === "backup") {
    try {
      const scriptPath = path.join(
        process.env.COMPOSE_DIR || "/home/ubuntu/schoolpro-prod",
        "scripts/backup-db.sh"
      )

      if (!fs.existsSync(scriptPath)) {
        return NextResponse.json(
          { error: "Script backup tidak ditemukan. Pastikan scripts/backup-db.sh ada di server." },
          { status: 404 }
        )
      }

      // Run backup in background (don't wait for completion to avoid timeout)
      exec(`bash ${scriptPath}`, (error) => {
        if (error) {
          console.error("Backup error:", error.message)
        }
      })

      return NextResponse.json({
        success: true,
        message: "Backup sedang diproses di background. Refresh halaman dalam beberapa saat untuk melihat hasilnya.",
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (action === "download") {
    const filename = body.filename
    if (!filename || !filename.startsWith("schoolpro_db_")) {
      return NextResponse.json({ error: "Nama file tidak valid" }, { status: 400 })
    }
    
    const filePath = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
