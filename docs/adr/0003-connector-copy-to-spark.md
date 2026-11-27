# 3. Copying connectors to the Spark pod without kubectl cp

## Status

Accepted

## Context

Registering a Spark connector extracts the bundle locally and copies it to `/data/connectors/<source>` on the Spark master pod. That copy used `kubectl cp`, which runs `tar` inside the destination container. The Spark image is built on `dhi.io/spark:3.5`, a hardened image with no `tar`, so every copy failed and the connector never reached Spark.

## Decision

- `stream_copy_to_pod` copies the extracted tree with `kubectl exec` and tools the image does have (`sh`, `mkdir`, `cat`, `wc`): one `mkdir -p` per directory, then one `sh -c 'cat > "$1"'` per file with the file on stdin.
- The remote path is passed to `sh` as `$1`, never spliced into the script text, so a quote in a file name from an uploaded archive can't break out of the command.
- `cat` exits 0 whatever it receives, so a stream that ends early would leave a partial file and report success. After each file, `sh -c 'wc -c < "$1"'` reads the size on the pod and it must equal the local file size, otherwise the copy fails with both numbers in the log. `wc` was checked in `sanketikahub/spark:2.2.0`.
- All three `subprocess.run` calls pass `text=True`, so errors are logged as text, not a bytes repr. Stdin is a file object, so the streamed bytes are passed through unchanged.

## Not carried across

The stream copy writes file contents only. Compared with `tar`:

- File modes are not kept; every file lands as a regular, non-executable file. Zip bundles already lose modes at `zipfile.extractall`, but a `.tar.gz` bundle with an executable loses the bit here. Connectors must not depend on an executable bit.
- Symlinked files are copied as regular files with the target's content; symlinked directories are not followed by `os.walk` and are skipped.
- Ownership is whatever user `kubectl exec` runs as in the pod.

## Alternatives considered

- Add `tar` back to the Spark image: `kubectl cp` would work again, but it adds a tool to a hardened image and needs an image rebuild and release.
- Let the Spark pod download the connector itself: the image already runs `connector.py` on start, which reads `connector_registry`, downloads through a pre-signed URL and extracts with Python, and it accepts `CONNECTOR_ID` for one connector. It would avoid the per-file copy and keep file modes, but depends on the connector already being `Live` in the registry when it runs. Left as a follow-up.

## Consequences

A copy now makes one `kubectl exec` per directory plus two per file, so bundles with many files take longer to register. `/data/connectors` is the `connector-data` persistent volume, so copied connectors survive a pod restart.
