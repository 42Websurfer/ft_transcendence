up:
	docker compose -f docker-compose.yml up -d

upb:
	docker compose -f docker-compose.yml build --no-cache
	docker compose -f docker-compose.yml up -d

restart:	down up

down:
	docker compose -f docker-compose.yml down

logs:
	docker compose -f docker-compose.yml logs

clean-volumes:
	@if [ -n "$$(docker volume ls -q)" ]; then docker volume rm $$(docker volume ls -q); fi

flogs:
	docker compose -f docker-compose.yml logs -f
