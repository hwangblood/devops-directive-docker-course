DATABASE_URL:=postgres://postgres:foobarbaz@localhost:5432/postgres
API_NODE_URL :=http://localhost:3000
API_GOLANG_URL :=http://localhost:8080

.PHONY: run-postgres
run-postgres:
	@echo Starting postgres container
	-docker run \
		-e POSTGRES_PASSWORD=foobarbaz \
		-v pgdata:/var/lib/postgresql/data \
		-p 5432:5432 \
		postgres:15.1-alpine

.PHONY: run-api-node
run-api-node:
	@echo Starting node api
	cd api-node && \
		DATABASE_URL=${DATABASE_URL} \
		npm run dev

.PHONY: run-api-golang
run-api-golang:
	@echo Starting golang api
	cd api-golang && \
		DATABASE_URL=${DATABASE_URL} \
		go run main.go

.PHONY: run-client-react
run-client-react:
	@echo Starting react client
	cd client-react && \
		API_NODE_URL=${API_NODE_URL} \
		API_GOLANG_URL=${API_GOLANG_URL} \
		npm run dev
