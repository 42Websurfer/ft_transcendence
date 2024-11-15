up:
	docker compose -f docker-compose.yml up -d

upb:
	docker compose -f docker-compose.yml build --no-cache
	docker compose -f docker-compose.yml up -d

down:
	docker compose -f docker-compose.yml down

logs:
	docker compose -f docker-compose.yml logs

flogs:
	docker compose -f docker-compose.yml logs -f
