import asyncio
from openai import AsyncOpenAI
from tools.repl import run_repl
from tools.deep_search import deep_search
from config import Secrets
import json

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_repl",
            "description": "Execute code in a Python REPL environment. The last expression is returned as the result. Do not use print to get the result.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute."
                    },
                    "timeout": {
                        "type": "number",
                        "description": "Maximum time in seconds to wait for code execution.",
                        "default": 5
                    }
                },
                "required": ["code"]
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "deep_search",
            "description": "Search for code patterns or documentation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find relevant code patterns or documentation."
                    }
                },
                "required": ["query"]
            },
            "strict": True
        }
    }
]
CLIENT = AsyncOpenAI(
    api_key=Secrets.OPENAI_API_KEY,
    base_url=Secrets.OPENAI_API_BASE_URL,
    timeout=60*5
)

class CodeAgent:
    def __init__(self):
        self.system_prompt = """
You are a code assistant that can use tools to perform tasks.

Available tools:
- deep_search: For searching the web for documentation, libraries, and tutorials
- run_repl: For executing python code and returning the result

When you need to use a tool, the model will call it directly via function calling.
"""

    async def run(self, user_query):
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_query}
        ]

        # First API call with tool definition
        response = await CLIENT.chat.completions.create(
            model=Secrets.OPENAI_API_MODEL,
            tools=TOOLS,
            messages=messages,
        )

        content = response.choices[0].message.content
        messages.append({"role": "assistant", "content": content or ""})
        tool_calls = response.choices[0].message.tool_calls

        # Handle function calls
        while tool_calls:
            for t in tool_calls:
                tool_name = t.function.name
                if not t.function.arguments:
                    print(f"Tool call for {tool_name} missing arguments. Skipping...")
                    continue
                args = json.loads(t.function.arguments)

                print(f"TOOL CALL: {tool_name}, {args}")

                # Execute the tool
                if tool_name == "deep_search":
                    tool_response = await deep_search(args["query"])
                elif tool_name == "run_repl":
                    tool_response = await run_repl(args["code"])
                else:
                    return f"Unknown tool: {tool_name}"

                print(f"TOOL RESPONSE: {tool_response}")

                # Append the function call and response to history
                messages.append({
                    "role": "tool",
                    "name": tool_name,
                    "content": str(tool_response)
                })

            # Get next response from the model
            response = await CLIENT.chat.completions.create(
                model=Secrets.OPENAI_API_MODEL,
                tools=TOOLS,
                messages=messages,
            )

            content = response.choices[0].message.content
            tool_calls = response.choices[0].message.tool_calls

        return content
