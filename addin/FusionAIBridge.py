# Fusion AI Bridge — Fusion 360 Addin
# HTTP server that receives Python scripts from the backend and executes them
# in Fusion 360's main thread via the custom event system.

import adsk.core
import adsk.fusion
import threading
import traceback
import json
import math
from http.server import HTTPServer, BaseHTTPRequestHandler

# ---------------------------------------------------------------------------
# Globals
# ---------------------------------------------------------------------------
_app = None
_ui = None
_server = None
_server_thread = None
_custom_event_id = "FusionAIBridge_ExecEvent"
_custom_event = None
_handlers = []

_exec_result = {"success": False, "message": "No script executed yet"}
_exec_done = threading.Event()

# ---------------------------------------------------------------------------
# HTTP Request Handler
# ---------------------------------------------------------------------------


class _RequestHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        response = json.dumps({"status": "running"})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response.encode("utf-8"))

    def do_POST(self):
        global _exec_result, _exec_done

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            code = data.get("code", "")

            if not code.strip():
                self._send_json(
                    400, {"success": False, "message": "No code provided"})
                return

            _exec_done.clear()
            _exec_result = {"success": False, "message": "Execution timed out"}

            _app.fireCustomEvent(_custom_event_id, code)
            _exec_done.wait(timeout=60)

            status_code = 200 if _exec_result["success"] else 500
            self._send_json(status_code, _exec_result)

        except json.JSONDecodeError:
            self._send_json(400, {"success": False, "message": "Invalid JSON"})
        except Exception as e:
            self._send_json(500, {"success": False, "message": str(e)})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, status, obj):
        response = json.dumps(obj)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response.encode("utf-8"))


# ---------------------------------------------------------------------------
# Custom Event Handler — runs on Fusion 360 main thread
# ---------------------------------------------------------------------------
class _ExecEventHandler(adsk.core.CustomEventHandler):
    def __init__(self):
        super().__init__()

    def notify(self, args):
        global _exec_result, _exec_done

        try:
            code = args.additionalInfo

            app = adsk.core.Application.get()
            ui = app.userInterface
            design = adsk.fusion.Design.cast(app.activeProduct)
            root_comp = design.rootComponent if design else None

            exec_scope = {
                "__builtins__": __builtins__,  # allow import inside exec
                "adsk": adsk,
                "adsk.core": adsk.core,
                "adsk.fusion": adsk.fusion,
                "app": app,
                "ui": ui,
                "design": design,
                "rootComp": root_comp,
                "math": math,
                "traceback": traceback,
            }

            exec(code, exec_scope)

            _exec_result = {"success": True,
                            "message": "Script executed successfully"}

        except Exception:
            _exec_result = {
                "success": False,
                "message": traceback.format_exc(),
            }
        finally:
            _exec_done.set()


# ---------------------------------------------------------------------------
# Addin Lifecycle
# ---------------------------------------------------------------------------
def run(context):
    global _app, _ui, _server, _server_thread, _custom_event, _handlers

    try:
        _app = adsk.core.Application.get()
        _ui = _app.userInterface

        _custom_event = _app.registerCustomEvent(_custom_event_id)
        handler = _ExecEventHandler()
        _custom_event.add(handler)
        _handlers.append(handler)

        _server = HTTPServer(("127.0.0.1", 8080), _RequestHandler)
        _server.allow_reuse_address = True

        _server_thread = threading.Thread(
            target=_server.serve_forever, daemon=True)
        _server_thread.start()

        _ui.messageBox("Fusion AI Bridge started on port 8080")

    except Exception:
        if _ui:
            _ui.messageBox(
                "Failed to start Fusion AI Bridge:\n" + traceback.format_exc())


def stop(context):
    global _app, _ui, _server, _server_thread, _custom_event, _handlers

    try:
        if _server:
            _server.shutdown()
            _server = None

        if _server_thread:
            _server_thread.join(timeout=5)
            _server_thread = None

        if _custom_event:
            _app.unregisterCustomEvent(_custom_event_id)
            _custom_event = None

        _handlers.clear()

    except Exception:
        if _ui:
            _ui.messageBox("Error stopping Fusion AI Bridge:\n" +
                           traceback.format_exc())
