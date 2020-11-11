package main

import (
	"github.com/gorilla/handlers"
	"github.com/rs/cors"
	"github.com/shared-spotify/app"
	"github.com/shared-spotify/logger"
	"github.com/shared-spotify/mongoclient"
	"github.com/shared-spotify/spotifyclient"
	muxtrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/gorilla/mux"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
	"gopkg.in/DataDog/dd-trace-go.v1/profiler"
	"net/http"
	"os"
)

var Port = os.Getenv("PORT")
var Env = os.Getenv("ENV")
var ReleaseVersion = os.Getenv("HEROKU_RELEASE_VERSION")

const Service = "shared-spotify-backend"

func startServer() {
	// Activate datadog tracer
	rules := []tracer.SamplingRule{tracer.RateRule(1)}
	tracer.Start(
		tracer.WithSamplingRules(rules),
		tracer.WithAnalytics(true),
		tracer.WithService(Service),
		tracer.WithEnv(Env),
		tracer.WithServiceVersion(ReleaseVersion),
	)
	defer tracer.Stop()

	logger.Logger.Warning("Datadog tracer started")

	// Activate datadog profiler
	err := profiler.Start(
		profiler.WithService(Service),
		profiler.WithEnv(Env),
		profiler.WithVersion(ReleaseVersion),
	);

	if err != nil {
		logger.Logger.Fatal("Failed to start profiler ", err)
	}

	logger.Logger.Warning("Datadog profiler started")

	defer profiler.Stop()

	logger.Logger.Warning("Starting server")

	// Create the router
	r := muxtrace.NewRouter()

	r.HandleFunc("/login", spotifyclient.Authenticate)
	r.HandleFunc("/callback", spotifyclient.CallbackHandler)

	r.HandleFunc("/user", spotifyclient.GetUser)

	r.HandleFunc("/rooms", app.RoomsHandler)
	r.HandleFunc("/rooms/{roomId:[a-zA-Z0-9]+}", app.RoomHandler)
	r.HandleFunc("/rooms/{roomId:[a-zA-Z0-9]+}/users", app.RoomUsersHandler)
	r.HandleFunc("/rooms/{roomId:[a-zA-Z0-9]+}/playlists", app.RoomPlaylistsHandler)
	r.HandleFunc("/rooms/{roomId:[a-zA-Z0-9]+}/playlists/{playlistId:[a-zA-Z0-9]+}", app.RoomPlaylistHandler)
	r.HandleFunc("/rooms/{roomId:[a-zA-Z0-9]+}/playlists/{playlistId:[a-zA-Z0-9]+}/add", app.RoomAddPlaylistHandler)

	// Setup cors policies
	options := cors.Options{
		AllowedOrigins: []string{spotifyclient.FrontendUrl},
		AllowCredentials: true,
	}
	handler := cors.New(options).Handler(r)

	// Setup request logging
	handler = handlers.LoggingHandler(logger.Logger.Out, handler)

	// Setup recovery in case of panic
	handler = handlers.RecoveryHandler()(handler)

	// Launch the server
	err = http.ListenAndServe(":" + Port, handler)
	if err != nil {
		logger.Logger.Fatal("Failed to start server ", err)
	}
}

func connectToMongo() {
	mongoclient.Initialise()
}

func main() {
	connectToMongo()
	startServer()
}
