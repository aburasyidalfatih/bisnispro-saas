-- CreateIndex
CREATE INDEX "pendaftar_ppdbs_dataFormulir_idx" ON "pendaftar_ppdbs" USING GIN ("dataFormulir");

-- CreateIndex
CREATE INDEX "pendaftar_ppdbs_dataOrangtua_idx" ON "pendaftar_ppdbs" USING GIN ("dataOrangtua");
