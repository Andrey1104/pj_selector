import { useEffect, useRef, useCallback, useState } from "react";

const SETTINGS_KEY = "laser-editor-settings";

/* ---------------- STORAGE ---------------- */

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveSettings(settings) {
    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}

function useBridge(iframeRef) {
    const send = (type, payload = {}) => {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        win.postMessage({type: "command", payload: { type, ...payload },}, "*");
    };

    return {
        setTool: (tool) => send("set-tool", { tool }),
        setZoom: (zoom) => send("set-zoom", { zoom }),
        setGrid: (v) => send("set-grid", { value: v }),
        setSnap: (v) => send("set-snap", { value: v }),
        getSvg: () => send("get-svg"),
        getZoom: () => send("get-zoom"),
    };
}

/* ---------------- COMPONENT ---------------- */

export default function SvgEditor() {
    const iframeRef = useRef(null);

    const bridge = useBridge(iframeRef);

    const [settings, setSettings] = useState({
        grid: true,
        snapToGrid: true,
        language: "en",
        units: "mm",
        theme: "dark",
    });

    const [state, setState] = useState({
        zoom: 3,
        tool: "select",
    });

    /* LOAD */
    useEffect(() => {
        const s = loadSettings();
        if (s) setSettings(s);
    }, []);

    /* SAVE */
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    /* SYNC SETTINGS → EDITOR */
    useEffect(() => {
        bridge.setGrid(settings.grid);
        bridge.setSnap(settings.snapToGrid);
    }, [settings.grid, settings.snapToGrid]);

    /* MESSAGES */
    const onMessage = useCallback((ev) => {
        const msg = ev.data;
        if (!msg) return;

        if (msg.type === "event") {
            const e = msg.payload;

            if (e.type === "svg") {
                console.log("SVG:", e.svg);
            }

            if (e.type === "zoom") {
                setState((p) => ({ ...p, zoom: e.zoom }));
            }

            if (e.type === "tool") {
                setState((p) => ({ ...p, tool: e.tool }));
            }
        }

        if (msg.type === "editor-ready") {
            bridge.setGrid(settings.grid);
            bridge.setSnap(settings.snapToGrid);
            bridge.getZoom();
        }
    }, [settings]);

    useEffect(() => {
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [onMessage]);

    return (
        <div>
            <iframe
                ref={iframeRef}
                src="/editor/index.html"
                style={{
                    width: "100vw",
                    height: "100vh",
                    border: "none",
                }}
            />
        </div>
    );
}
