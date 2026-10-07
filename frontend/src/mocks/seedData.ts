export const mockData = {
  "fixture": [
    {
      "id": 1,
      "fixture_code": "fixture code 1",
      "fixture_type": "SPOT",
      "position_x": "position x 1",
      "position_y": "position y 1",
      "dmx_address": "dmx address 1",
      "channel_count": "channel count 1",
      "color_mode": "color mode 1"
    },
    {
      "id": 2,
      "fixture_code": "fixture code 2",
      "fixture_type": "WASH",
      "position_x": "position x 2",
      "position_y": "position y 2",
      "dmx_address": "dmx address 2",
      "channel_count": "channel count 2",
      "color_mode": "color mode 2"
    },
    {
      "id": 3,
      "fixture_code": "fixture code 3",
      "fixture_type": "BEAM",
      "position_x": "position x 3",
      "position_y": "position y 3",
      "dmx_address": "dmx address 3",
      "channel_count": "channel count 3",
      "color_mode": "color mode 3"
    }
  ],
  "cueScene": [
    {
      "id": 1,
      "name": "name 1",
      "fixture_states": "fixture states 1",
      "fade_in_ms": "fade in ms 1",
      "hold_ms": "hold ms 1",
      "priority": "priority 1",
      "scene_status": "READY"
    },
    {
      "id": 2,
      "name": "name 2",
      "fixture_states": "fixture states 2",
      "fade_in_ms": "fade in ms 2",
      "hold_ms": "hold ms 2",
      "priority": "priority 2",
      "scene_status": "DISABLED"
    },
    {
      "id": 3,
      "name": "name 3",
      "fixture_states": "fixture states 3",
      "fade_in_ms": "fade in ms 3",
      "hold_ms": "hold ms 3",
      "priority": "priority 3",
      "scene_status": "DRAFT"
    }
  ],
  "timelineTrack": [
    {
      "id": 1,
      "cue_scene_id": 1,
      "start_ms": "start ms 1",
      "duration_ms": "duration ms 1",
      "layer": "layer 1",
      "locked": "locked 1"
    },
    {
      "id": 2,
      "cue_scene_id": 2,
      "start_ms": "start ms 2",
      "duration_ms": "duration ms 2",
      "layer": "layer 2",
      "locked": "locked 2"
    },
    {
      "id": 3,
      "cue_scene_id": 3,
      "start_ms": "start ms 3",
      "duration_ms": "duration ms 3",
      "layer": "layer 3",
      "locked": "locked 3"
    }
  ],
  "showProject": [
    {
      "id": 1,
      "title": "title 1",
      "venue_name": "venue name 1",
      "fixture_ids": [
        1,
        2
      ],
      "track_ids": [
        1,
        2
      ],
      "updated_at": "2026-06-11T09:00:00Z"
    },
    {
      "id": 2,
      "title": "title 2",
      "venue_name": "venue name 2",
      "fixture_ids": [
        1,
        2
      ],
      "track_ids": [
        1,
        2
      ],
      "updated_at": "2026-06-12T09:00:00Z"
    },
    {
      "id": 3,
      "title": "title 3",
      "venue_name": "venue name 3",
      "fixture_ids": [
        1,
        2
      ],
      "track_ids": [
        1,
        2
      ],
      "updated_at": "2026-06-13T09:00:00Z"
    }
  ]
} as const;
