 # Software Mental Model — for AI PMs

   ## The 7 concepts
   - **Program** — A text file of instructions a machine follows literally, character by character.
   - **Runtime** — A runtime is the engine that reads and runs your code. For Python, that's the Python interpreter; for JavaScript on a server, that's Node.js. 
  Example: the Python interpreter
   - **Library** — Reusable code I call into. *I'm* in charge of the flow.
   Library example: requests.
   - **Framework** —Reusable code that calls into *me*. The framework owns the flow. Framework example: Django or Flask.
   - **Package** — A package is the shipping/distribution unit; a library is the code inside. When you pip install anthropic, you're downloading the package; the library is what you import.
   - **Client / Server** — Client: A device or program that requests data or services (e.g., web browser). Server: A system that stores resources, manages data and serves the request.
   - **API** — An API is the contract — the agreed-upon shape of requests and responses.  Example: Anthropic's `/v1/messages` API contract — send JSON with `{model, messages}`, get JSON back with `{content}`.

   - **JSON** — text-based data format widely used that is human readable and machine-parseable in every language, and every modern AI API speaks it.   {"name": "Alice", "tags": ["pm"]}
   - **Terminal** —An interface where users type commands and receive output from the system. 

   ## The sequence diagram
    User->>Browser: "where's my order #12345"
    Browser->>Backend: POST /api/support-chat (JSON)
    Backend->>DB: lookup order #12345
    DB-->>Backend: order status
    Backend->>Anthropic: POST /v1/messages (JSON)
    Anthropic->>Claude: run inference
    Claude-->>Anthropic: generated text
    Anthropic-->>Backend: JSON response
    Backend-->>Browser: JSON reply
    Browser->>User: render reply

   ## Real-world walkthrough — in my own words
   A customer types "where's my order?" into the chat widget on Acme's e-commerce site. The **browser** (client) sends the message as **JSON** to Acme's **backend server**, which is a Python **program** running on AWS in a Python **runtime**. The backend first looks up the order in the database to get real status info, then builds a prompt and **calls the Anthropic API** — using the `anthropic` Python **package**. The API server forwards the request to the Claude **model** (the trained neural network on GPUs), gets back generated text, and returns it as JSON. The backend forwards that JSON to the browser, which renders it in the chat bubble.


   ## What I'm still fuzzy on
    Why a "virtual environment" exists — I have a `.venv/` folder but I don't yet understand what problem it solves. Also, the ways to structure folders or commit to git.
-
