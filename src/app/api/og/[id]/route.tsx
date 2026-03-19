import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    try {
        const host = request.headers.get("host") || "presx.app";
        const sp = request.nextUrl.searchParams;

        const title = (sp.get("t") || "Presentation").toUpperCase();
        const score = sp.get("s") || "0";
        const fluency = sp.get("f") || "0";
        const pacing = sp.get("p") || "0";
        const clarity = sp.get("c") || "0";
        const structure = sp.get("st") || "0";
        const engagement = sp.get("e") || "0";
        const vocabulary = sp.get("v") || "0";
        const wpm = sp.get("wpm") || "0";
        const fillers = sp.get("fl") || "0";

        return new ImageResponse(
            (
                <div
                    style={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        backgroundColor: "#000000",
                        color: "white",
                        padding: "48px 56px",
                    }}
                >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: 20, color: "#9ca3af", letterSpacing: 3, fontWeight: 600 }}>
                                {title}
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <div style={{ fontSize: 96, fontWeight: 900, color: "white", lineHeight: 1 }}>
                                    {score}
                                </div>
                                <div style={{ fontSize: 24, color: "#4b5563", marginLeft: 12 }}>/100</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline" }}>
                            <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>PresX</span>
                            <span style={{ fontSize: 32, fontWeight: 700, color: "#5e17eb" }}>.</span>
                        </div>
                    </div>

                    {/* Stats Row 1 */}
                    <div style={{ display: "flex" }}>
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#111111", border: "1px solid #333333", borderRadius: 16, padding: "16px 24px", width: 176, marginRight: 16 }}>
                            <div style={{ fontSize: 13, color: "#9ca3af", letterSpacing: 1, fontWeight: 700 }}>FLUENCY</div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{fluency}</span>
                                <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 6 }}>/100</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#111111", border: "1px solid #333333", borderRadius: 16, padding: "16px 24px", width: 176, marginRight: 16 }}>
                            <div style={{ fontSize: 13, color: "#9ca3af", letterSpacing: 1, fontWeight: 700 }}>PACING</div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{pacing}</span>
                                <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 6 }}>/100</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#111111", border: "1px solid #333333", borderRadius: 16, padding: "16px 24px", width: 176, marginRight: 16 }}>
                            <div style={{ fontSize: 13, color: "#9ca3af", letterSpacing: 1, fontWeight: 700 }}>CLARITY</div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{clarity}</span>
                                <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 6 }}>/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row 2 */}
                    <div style={{ display: "flex" }}>
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#111111", border: "1px solid #333333", borderRadius: 16, padding: "16px 24px", width: 176, marginRight: 16 }}>
                            <div style={{ fontSize: 13, color: "#9ca3af", letterSpacing: 1, fontWeight: 700 }}>STRUCTURE</div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{structure}</span>
                                <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 6 }}>/100</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#111111", border: "1px solid #333333", borderRadius: 16, padding: "16px 24px", width: 176, marginRight: 16 }}>
                            <div style={{ fontSize: 13, color: "#9ca3af", letterSpacing: 1, fontWeight: 700 }}>ENGAGEMENT</div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{engagement}</span>
                                <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 6 }}>/100</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#111111", border: "1px solid #333333", borderRadius: 16, padding: "16px 24px", width: 176, marginRight: 16 }}>
                            <div style={{ fontSize: 13, color: "#9ca3af", letterSpacing: 1, fontWeight: 700 }}>VOCABULARY</div>
                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
                                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{vocabulary}</span>
                                <span style={{ fontSize: 14, color: "#4b5563", marginLeft: 6 }}>/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #222222", paddingTop: 20 }}>
                        <div style={{ display: "flex" }}>
                            <div style={{ display: "flex", alignItems: "baseline", marginRight: 32 }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>{wpm}</span>
                                <span style={{ fontSize: 14, color: "#6b7280", letterSpacing: 1, fontWeight: 600, marginLeft: 8 }}>WPM</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>{fillers}</span>
                                <span style={{ fontSize: 14, color: "#6b7280", letterSpacing: 1, fontWeight: 600, marginLeft: 8 }}>FILLERS</span>
                            </div>
                        </div>
                        <div style={{ fontSize: 16, color: "#6b7280" }}>{host}</div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch {
        return new Response("Failed to generate image", { status: 500 });
    }
}
