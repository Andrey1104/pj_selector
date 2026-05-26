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
        layerView: "all", // "all" | "current" | "hidden"
        gridMode: "lines", // "lines" | "dots" | "none"
        wireframeMode: false, // true | false
        zoom: 1,
    });

    const [state, setState] = useState({
        tool: "select",
    });

    const [editorReady, setEditorReady] = useState(false);

    /* LOAD */
    useEffect(() => {
        const s = loadSettings();
        if (s) setSettings(prev => ({ ...prev, ...s }));
    }, []);

    /* SAVE */
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    /* SYNC SETTINGS → EDITOR */
    useEffect(() => {
        if (editorReady) {
            bridge.setGrid(settings.grid);
            bridge.setSnap(settings.snapToGrid);
        }
    }, [settings.grid, settings.snapToGrid, editorReady]);

    // Відправляємо зум тільки коли редактор готовий і зум змінився
    useEffect(() => {
        if (editorReady) {
            bridge.setZoom(settings.zoom);
        }
    }, [settings.zoom, editorReady]);

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
                setSettings((prev) => prev.zoom !== e.zoom ? { ...prev, zoom: e.zoom } : prev);
            }

            if (e.type === "tool") {
                setState((p) => ({ ...p, tool: e.tool }));
            }
        }

        if (msg.type === "editor-ready") {
            setEditorReady(true);
            bridge.setGrid(settings.grid);
            bridge.setSnap(settings.snapToGrid);
            // Надсилаємо зум кілька разів для гарантії
            bridge.setZoom(settings.zoom);
            setTimeout(() => bridge.setZoom(settings.zoom), 100);
            setTimeout(() => bridge.setZoom(settings.zoom), 300);
        }
    }, [settings]);

    useEffect(() => {
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [onMessage]);

    return (
        <div>
            {/*
              Для тесту: перемикайте режими так:
              setSettings(s => ({ ...s, layerView: "current" }));
              setSettings(s => ({ ...s, gridMode: "dots" }));
              setSettings(s => ({ ...s, wireframeMode: !s.wireframeMode }));
            */}
            <iframe
                ref={iframeRef}
                src="/svgedit/dist/editor/index.html"
                style={{
                    width: "100vw",
                    height: "100vh",
                    border: "none",
                }}
            />
        </div>
    );
}
