@echo off
echo Stopping RabbitMQ container...

docker stop rmq_rabbitmq
docker rm rmq_rabbitmq

echo.
echo RabbitMQ container stopped and removed.
echo. 