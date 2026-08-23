# ===================================
# Dockerfile - Portfolio Static Web
# Base: nginx:alpine (siêu nhẹ ~25MB)
# ===================================
FROM nginx:alpine

# Metadata
LABEL maintainer="Hoang Vu <hoangvu@email.com>"
LABEL description="Portfolio website served by Nginx Alpine"
LABEL version="1.0"

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/portfolio.conf

# Copy static files
COPY ../src/ /usr/share/nginx/html/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
