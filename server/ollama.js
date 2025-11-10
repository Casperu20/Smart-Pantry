app.get('/api/chat-stream', (req, res) => {
  const prompt = req.query.prompt;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const llm = spawn('ollama', ['run', MODEL, prompt]);
  llm.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      try {
        const obj = JSON.parse(line);
        res.write(`data: ${obj.response || ''}\n\n`);
      } catch {}
    });
  });

  llm.on('close', () => res.end());
});
