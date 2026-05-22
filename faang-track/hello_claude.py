# hello_claude.py
# Your first programmatic conversation with Claude.

# --- Imports: pulling in the libraries we installed ---
import os                          # built-in: read environment variables
from dotenv import load_dotenv     # python-dotenv: loads .env into os.environ
from anthropic import Anthropic    # the official Anthropic SDK

# --- Step 1: load the API key from .env into the environment ---
# load_dotenv() looks for a file called ".env" in the current directory,
# reads each KEY=VALUE line, and exposes them via os.environ.
load_dotenv()

# --- Step 2: create the Anthropic client ---
# By default, the SDK looks for an env var called ANTHROPIC_API_KEY.
# That's exactly what we put in .env, so this "just works."
client = Anthropic()

# --- Step 3: send a message ---
# This is THE core API call. Memorize this shape — you'll write it 1000+ times.
response = client.messages.create(
    model="claude-sonnet-4-5",          # which Claude variant to use
    max_tokens=300,                      # cap on the reply length
    messages=[
        {
            "role": "user",
            "content": "In 3 sentences, explain what an LLM is to a non-technical PM."
        }
    ]
)

# --- Step 4: print the reply ---
# response.content is a list of "content blocks". For a plain text reply,
# there's one block with .type == "text" and .text == the actual reply string.
print(response.content[0].text)

# --- Step 5: print the cost & token info ---
# This metadata comes back on every response. As an AI PM, you should
# always know what you spent. Cost engineering is half the job.
print("\n--- usage ---")
print(f"Input tokens:  {response.usage.input_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")