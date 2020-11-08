package httputils

import (
	"encoding/json"
	"github.com/shared-spotify/logger"
	"net/http"
)

// Do not forget v needs to be a reference to the object for the serialisation to work
func DeserialiseBody(r *http.Request, v interface{}) error {
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(v)

	if err != nil {
		logger.Logger.Error("Failed to deserialise body", err)
		return err
	}

	return nil
}

func SendJson(w http.ResponseWriter, v interface{})  {
	jsonValue, err := json.Marshal(v)

	if err != nil {
		http.Error(w, "Failed to serialise struct", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(jsonValue)

	if err != nil {
		http.Error(w, "Failed to write json response", http.StatusInternalServerError)
		return
	}
}

func SendOk(w http.ResponseWriter)  {
	w.WriteHeader(http.StatusOK)
}

func UnhandledError(w http.ResponseWriter)  {
	http.Error(w, "", http.StatusInternalServerError)
}

func AuthenticationError(w http.ResponseWriter, r *http.Request)  {
	http.Error(w, "You need to be login to perform this action", http.StatusUnauthorized)
}