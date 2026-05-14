FROM nginx:alpine
# Cloud Run requires the container to listen on the port defined by the PORT environment variable (default 8080)
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
