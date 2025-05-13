@echo off
echo Starting RabbitMQ container...

docker run -d --name rmq_rabbitmq ^
  -p 5672:5672 ^
  -p 15672:15672 ^
  -e RABBITMQ_DEFAULT_USER=rmquser ^
  -e RABBITMQ_DEFAULT_PASS=rmqpassword ^
  -e RABBITMQ_DEFAULT_VHOST=/ ^
  rabbitmq:3-management-alpine

echo.
echo RabbitMQ started successfully!
echo Management interface: http://localhost:15672/
echo Username: rmquser
echo Password: rmqpassword
echo. 