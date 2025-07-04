import pyodide
from typing import Dict, Any

async def run_repl(code: str) -> Dict[str, Any]:
    try:
        result = await pyodide.code.eval_code_async(code)
    except Exception as e:
        return {
            "result": None,
            "error": str(e),
            "success": False
        }

    return {
        "result": result,
        "error": None,
        "success": True
    }
