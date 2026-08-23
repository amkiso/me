FROM php:8.2-fpm-alpine

# Copy custom security php.ini
COPY php.ini /usr/local/etc/php/conf.d/sandbox.ini

WORKDIR /var/www/uploads/assignments

EXPOSE 9000
CMD ["php-fpm"]
