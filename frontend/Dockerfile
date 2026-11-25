FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=https://ahps-production-ec0f0783.up.railway.app/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA Routing nginx config supporting Railway default ports (80, 8080, 5173)
RUN echo 'server { \
    listen 80; \
    listen 8080; \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80 8080 5173

CMD ["nginx", "-g", "daemon off;"]

