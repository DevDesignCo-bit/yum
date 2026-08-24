# Yumetics

Yumetics is a local Node.js app for meal logging and pantry-based recipe suggestions. Food photos are analyzed on the server with the OpenAI Responses API, so a dessert such as tiramisu is identified from the picture rather than guessed from its dominant colours.

## Run locally

1. Install Node.js 18 or later.
2. Set an API key in your terminal (do not put it in source code):

   ```powershell
   $env:OPENAI_API_KEY="your_key_here"
   npm start
   ```

3. Open `http://localhost:4174`.

`OPENAI_MODEL` is optional and defaults to `gpt-5.6-terra`. The server keeps image-analysis requests out of the browser and does not store Responses API calls (`store: false`).

## Upload to GitHub

The project includes a `.gitignore` that excludes secrets. From this folder:

```powershell
git init
git add .
git commit -m "Initial Yumetics release"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPOSITORY.git
git push -u origin main
```

For a deployed app, configure `OPENAI_API_KEY` as a secret/environment variable in the hosting service. Never commit a real API key or `.env` file.
