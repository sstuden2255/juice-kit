# syntax=docker/dockerfile:1
# Dev image for compose.yaml: only Node + pnpm. Source is bind-mounted; dependencies are
# installed into named volumes at container start (see the web service command).
FROM node:24-bookworm-slim
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# corepack is deprecated and gone from Node 25+, so install pnpm explicitly.
RUN npm install -g pnpm@12.4.2
WORKDIR /app
EXPOSE 3000
