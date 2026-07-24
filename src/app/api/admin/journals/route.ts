import { NextResponse } from 'next/server';
export async function GET(req: Request) { return NextResponse.json({ journals: [], unsubmittedStaff: [], stats: { totalStaff: 0, submittedCount: 0, unsubmittedCount: 0 } }); }
