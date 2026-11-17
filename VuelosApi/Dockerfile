FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY VuelosApi.csproj ./
RUN dotnet restore VuelosApi.csproj

COPY . .
RUN dotnet publish VuelosApi.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 10000
ENTRYPOINT ["sh", "-c", "dotnet VuelosApi.dll --urls http://0.0.0.0:${PORT:-10000}"]
