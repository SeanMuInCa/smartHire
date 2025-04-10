import json
from openai import OpenAI

client = OpenAI(
    api_key="sk-4e98eb1df2dc496dbf9cf38f1aa8320e",
    base_url="https://api.deepseek.com",
)

system_prompt = """
You are a resume parser. The user will provide raw resume text.
Please extract the following fields and output as a JSON object:
- name
- email
- phone
- education (list of strings)
- skills (list of strings)

Return ONLY valid JSON.
"""

user_prompt = raw_resume

messages = [{"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}]

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=messages,
    response_format={
        'type': 'json_object'
    }
)

print(json.loads(response.choices[0].message.content))