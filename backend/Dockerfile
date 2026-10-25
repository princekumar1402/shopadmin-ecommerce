FROM php:8.2-cli-alpine

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app", "/app/router.php"]
