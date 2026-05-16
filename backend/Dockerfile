FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .

FROM base AS deps
RUN pip install --no-cache-dir -r requirements.txt

FROM deps AS test
COPY . .
RUN pytest test_main.py -v

FROM deps AS production
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]