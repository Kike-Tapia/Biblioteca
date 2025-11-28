# Imagen oficial de PHP 8.2 con Apache
FROM php:8.2-apache

# Copiar tu proyecto al directorio público del servidor web
COPY . /var/www/html/

# Instalar extensiones de PHP necesarias (por ejemplo MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Dar permisos si es necesario
RUN chown -R www-data:www-data /var/www/html

# Exponer el puerto de Apache
EXPOSE 80

# Iniciar Apache
CMD ["apache2-foreground"]

