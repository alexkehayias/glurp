import json
import asyncio
from pyodide.http import pyfetch
from typing import List, Dict, Union
from openai import AsyncOpenAI
from config import Secrets


CLIENT = AsyncOpenAI(
    api_key=Secrets.OPENAI_API_KEY,
    base_url=Secrets.OPENAI_API_BASE_URL,
    timeout=60*5
)


async def search_searxng(query: str) -> List[Dict[str, Union[str, None]]]:
    url = 'http://localhost:8080/search'
    params = {'q': query, 'format': 'json'}
    full_url = f"{url}?{'&'.join([f'{key}={value}' for key, value in params.items()])}"

    try:
        response = await pyfetch(full_url)
        if response.status != 200:
            print(f"Error during search: {response.status}")
            return []
        json_data = await response.json()
        return json_data.get('results', [])
    except Exception as e:
        print(f"Error during search: {e}")
        return []

async def assess_accuracy_with_llm(results: List[Dict[str, Union[str, None]]], query: str) -> bool:
    for result in results:
        snippet = result.get('content', '')
        prompt = f"Assess the relevance of this text to the query: '{query}'. Return 'relevant' or 'not relevant'.\n\nText: {snippet}"

        try:
            response = await CLIENT.chat.completions.create(
                model=Secrets.OPENAI_API_MODEL,
                messages=[
                    {"role": "system", "content": prompt}
                ],
            )
            assessment = response.choices[0].message.content.strip().lower()
            if assessment == 'relevant':
                return True
        except Exception as e:
            print(f"Error assessing relevance: {e}")

    return False

async def rewrite_queries_with_llm(query: str) -> List[str]:
    messages = [
        {
            "role": "system",
            "content": "You are a helpful search assistant that outputs JSON."
        },
        {
            "role": "user",
            "content": (
                f"Rewrite this query and suggest 3-5 related subqueries: '{query}'\n"
                "Return ONLY valid JSON with the structure: {\"queries\": [\"rewritten1\", \"subquery2\", ...]}"
            )
        }
    ]

    try:
        response = await CLIENT.chat.completions.create(
            model=Secrets.OPENAI_API_MODEL,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "querySchema",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "queries": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            }
                        },
                        "required": ["queries"]
                    }
                }
            }
        )
        json_str = response.choices[0].message.content.strip()
        data = json.loads(json_str)
        return data["queries"]
    except Exception as e:
        print(f"Error generating subqueries: {e}")
        return []

async def compile_results(results: List[Dict[str, Union[str, None]]]) -> List[Dict[str, str]]:
    sources = []
    for result in results:
        source = {
            'url': result.get('url', ''),
            'text': result.get('content', '')[:200],
        }
        sources.append(source)
    return sources

async def generate_summary(sources: List[Dict[str, str]]) -> str:
    source_texts = '\n'.join([src['text'] for src in sources])
    prompt = f"Summarize the following information: {source_texts}"

    try:
        response = await CLIENT.chat.completions.create(
            model=Secrets.OPENAI_API_MODEL,
            messages=[
                {"role": "system", "content": prompt}
            ],
        )
        summary_text = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating summary: {e}")
        summary_text = "Summary generation failed."

    return summary_text

async def deep_search(query: str) -> Dict[str, Union[str, List[Dict[str, str]]]]:
    sub_queries = await rewrite_queries_with_llm(query)
    max_iterations = min(len(sub_queries), 3)
    best_results = []

    for i in range(max_iterations):
        current_query = sub_queries[i]
        results = await search_searxng(current_query)
        best_results.extend(results)

        # Optional accuracy check
        # if await assess_accuracy_with_llm(results, current_query):
        #     best_results.extend(results)

    sources = await compile_results(best_results)
    summary = await generate_summary(sources)

    return {
        'summary': summary,
        'sources': sources
    }
