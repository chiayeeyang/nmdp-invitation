CREATE TABLE IF NOT EXISTS interactions (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK (kind IN ('visit','plant','calendar','nmdp')),
 source TEXT NOT NULL CHECK (source IN ('leaflet','social','direct')),
 flower INTEGER,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK ((kind = 'plant' AND flower IS NOT NULL AND flower BETWEEN 0 AND 2147483647)
     OR (kind <> 'plant' AND flower IS NULL))
);
CREATE INDEX IF NOT EXISTS interactions_kind_created_at ON interactions(kind, created_at DESC);
