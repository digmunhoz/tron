start:
	@docker compose -f docker/docker-compose.yaml up -d

api-migrate:
	@docker compose -f docker/docker-compose.yaml run --rm api sh -c 'alembic revision --autogenerate'

api-migration:
	@docker compose -f docker/docker-compose.yaml run --rm api sh -c 'alembic upgrade head'

api-test:
	@docker compose -f docker/docker-compose.yaml run --rm api-test

portal-migration:
	@docker compose -f docker/docker-compose.yaml run --rm portal sh -c 'python manage.py makemigrations'

portal-migrate:
	@docker compose -f docker/docker-compose.yaml run --rm portal sh -c 'python manage.py migrate portal'

build:
	@docker compose -f docker/docker-compose.yaml build

stop:
	@docker compose -f docker/docker-compose.yaml down -v

logs:
	@docker compose -f docker/docker-compose.yaml logs -f

status:
	@docker compose -f docker/docker-compose.yaml ps
