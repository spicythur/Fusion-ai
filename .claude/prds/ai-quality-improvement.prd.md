# AI Script Generation Quality Improvement

## Problem
Fusion 360 Python script generation sering error dan nggak akurat sama perintah user. User target (mahasiswa dan user biasa) sering dapet script yang gagal di-execute di Fusion 360, atau hasilnya nggak sesuai ekspektasi. Ini bikin user frustrasi dan nggak trust sama tool.

## Evidence
- Assumption — needs validation via user testing dan error logging
- Observasi: "bad index parameter" error waktu test sheet metal bracket
- System prompt belum cover semua use case (sheet metal, assemblies kompleks)

## Users
- **Primary**: Mahasiswa dan user biasa yang bikin 3D model di Fusion 360. Mereka tau mau bikin apa tapi nggak bisa coding Python.
- **Not for**: Professional engineer yang udah expert Fusion 360 API (mereka bisa coding sendiri).

## Hypothesis
We believe **improving system prompt coverage + adding error recovery + better validation** will **reduce script generation errors dan improve akurasi** for **mahasiswa dan user biasa**. We'll know we're right when **success rate naik dari ~70% ke ~90%** dan **user nggak perlu retry prompt yang sama**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Script success rate | 90%+ | Error tracking di backend |
| Retry rate | <10% | User generate ulang prompt yang sama |
| User satisfaction | 4+/5 | Rating system di chat |

## Scope
**MVP** — Minimum buat test hypothesis:
1. Expand system prompt dengan lebih banyak examples (sheet metal, assemblies, complex geometry)
2. Add error recovery: kalau script error, AI coba fix otomatis
3. Add validation: cek script sebelum kirim ke Fusion 360

**Out of scope**
- Custom UI untuk preview 3D model — butuh Fusion 360 plugin yang lebih complex
- Multi-step generation (break jadi beberapa script) — bisa nanti kalau MVP berhasil
- Real-time collaboration — nggak relevan untuk MVP

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | System Prompt Expansion | Lebih banyak geometry types yang berhasil | pending | — |
| 2 | Error Recovery | Script error auto-fix tanpa user intervention | pending | — |
| 3 | Script Validation | Cek syntax/API sebelum kirim ke Fusion 360 | pending | — |
| 4 | Success Tracking | Dashboard lihat success rate per geometry type | pending | — |

## Open Questions
- [ ] Berapa banyak examples yang cukup di system prompt?
- [ ] Error recovery: regenerate atau patch?
- [ ] Validation: syntax check atau API compatibility check?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| System prompt terlalu panjang | Medium | Token cost naik | Prioritas examples yang paling sering dipakai |
| Error recovery bikin infinite loop | Low | Script nggak selesai-selesai | Max 3 retry attempts |
| Validation terlalu ketat | Medium | Script yang valid ditolak | Test dengan real user prompts |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
