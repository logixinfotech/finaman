import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Worker is served from your own /public folder — no CDN dependency.
// Copy node_modules/pdfjs-dist/build/pdf.worker.min.mjs into public/
// (older pdfjs versions ship pdf.worker.min.js — match the filename here).
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

// ─────────────────────────────────────────────────────────────────────────────
// Renders every page of a PDF onto <canvas> elements.
// Works identically on Android, iOS and desktop because WE draw it —
// nothing relies on the browser's (missing on Android) inline PDF viewer.
// ─────────────────────────────────────────────────────────────────────────────
const PdfView = ({ url }) => {
    const wrapRef = useRef(null);
    const [status, setStatus] = useState("loading"); // loading | done | error

    useEffect(() => {
        let cancelled = false;
        const wrap = wrapRef.current;
        if (wrap) wrap.innerHTML = "";
        setStatus("loading");

        (async () => {
            try {
                const pdf = await pdfjsLib.getDocument(url).promise;
                if (cancelled) return;

                for (let n = 1; n <= pdf.numPages; n++) {
                    const page = await pdf.getPage(n);
                    if (cancelled) return;

                    const base  = page.getViewport({ scale: 1 });
                    const width = (wrap && wrap.clientWidth) || 600;
                    const dpr   = window.devicePixelRatio || 1;
                    // scale so the page fills the container width, then * dpr for sharpness
                    const vp    = page.getViewport({ scale: (width / base.width) * dpr });

                    const canvas  = document.createElement("canvas");
                    canvas.width  = vp.width;
                    canvas.height = vp.height;
                    canvas.style.width        = "100%";
                    canvas.style.height       = "auto";
                    canvas.style.display      = "block";
                    canvas.style.marginBottom = "8px";
                    canvas.style.borderRadius = "4px";
                    canvas.style.boxShadow    = "0 1px 3px rgba(0,0,0,0.18)";
                    wrap.appendChild(canvas);

                    await page.render({
                        canvasContext: canvas.getContext("2d"),
                        viewport: vp,
                    }).promise;
                }
                if (!cancelled) setStatus("done");
            } catch (e) {
                console.error("PDF render error:", e);
                if (!cancelled) setStatus("error");
            }
        })();

        return () => { cancelled = true; };
    }, [url]);

    return (
        <div className="w-full h-full overflow-auto bg-slate-200 p-2">
            <div ref={wrapRef} />
            {status === "loading" && (
                <div className="text-center text-[12px] text-slate-500 py-4">
                    Loading PDF…
                </div>
            )}
            {status === "error" && (
                <div className="text-center text-[12px] text-slate-500 py-4">
                    Couldn’t render preview.{" "}
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                    >
                        Open file
                    </a>
                </div>
            )}
        </div>
    );
};

export default PdfView;
