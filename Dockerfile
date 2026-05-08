# Use stable Python version
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy only server directory contents (not entire repo)
COPY server/ ./server/

# Set working directory to server
WORKDIR /app/server

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port Render expects
EXPOSE $PORT

# Run FastAPI with uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port $PORT