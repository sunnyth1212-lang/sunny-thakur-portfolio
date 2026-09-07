param (
    [int]$Port = 8080,
    [string]$Directory = "c:\Users\sunny\OneDrive\Desktop\sunny-thakur-portfolio"
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "Localhost server started successfully at $prefix"
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".mp4"  = "video/mp4"
    ".woff2"= "font/woff2"
    ".woff" = "font/woff"
    ".ttf"  = "font/ttf"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Range, Authorization")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }

        $rawUrl = $request.Url.AbsolutePath
        $cleanPath = [System.Uri]::UnescapeDataString($rawUrl.TrimStart('/'))

        # API: Save Portfolio Data
        if ($request.HttpMethod -eq "POST" -and $cleanPath -eq "api/save-data") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()

                if (-not [string]::IsNullOrWhiteSpace($body)) {
                    $parsedObj = $body | ConvertFrom-Json
                    # Format as valid data.js file
                    $jsonFormatted = $body | ConvertFrom-Json | ConvertTo-Json -Depth 10
                    $fileContent = @"
/**
 * =========================================================================
 * SUNNY THAKUR PORTFOLIO - CENTRAL DATA CONFIGURATION
 * Laser-Focused on High-Retention Short-Form Content (Reels, Shorts, TikTok)
 * Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") via Admin Panel
 * =========================================================================
 */

const PORTFOLIO_DATA = $body;

// Export for module or global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PORTFOLIO_DATA;
}
"@
                    $dataJsPath = Join-Path $Directory "data.js"
                    [System.IO.File]::WriteAllText($dataJsPath, $fileContent, [System.Text.Encoding]::UTF8)

                    $respJson = '{"success":true,"message":"Portfolio data successfully saved to data.js"}'
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $response.ContentLength64 = $respBytes.Length
                    $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
                } else {
                    $response.StatusCode = 400
                }
            } catch {
                $errJson = '{"success":false,"error":"' + $_.Exception.Message.Replace('"', '\"') + '"}'
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # API: List Available Videos
        if ($cleanPath -eq "api/list-videos") {
            try {
                $videosDir = Join-Path $Directory "public\videos"
                $videoFiles = @()
                if (Test-Path $videosDir) {
                    $files = Get-ChildItem -Path $videosDir -Filter "*.mp4" -File
                    foreach ($f in $files) {
                        $videoFiles += @{
                            name = $f.Name
                            size = $f.Length
                            path = "public/videos/$($f.Name)"
                        }
                    }
                }
                $listJson = @{ success = $true; videos = $videoFiles } | ConvertTo-Json -Depth 3
                $listBytes = [System.Text.Encoding]::UTF8.GetBytes($listJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $listBytes.Length
                $response.OutputStream.Write($listBytes, 0, $listBytes.Length)
            } catch {
                $response.StatusCode = 500
            }
            $response.OutputStream.Close()
            continue
        }

        # API: Save New Inquiry
        if ($request.HttpMethod -eq "POST" -and $cleanPath -eq "api/save-inquiry") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()

                if (-not [string]::IsNullOrWhiteSpace($body)) {
                    $newInquiry = $body | ConvertFrom-Json
                    $inquiriesPath = Join-Path $Directory "inquiries.json"
                    $inquiriesList = @()

                    if (Test-Path $inquiriesPath) {
                        try {
                            $existingRaw = [System.IO.File]::ReadAllText($inquiriesPath, [System.Text.Encoding]::UTF8)
                            if (-not [string]::IsNullOrWhiteSpace($existingRaw)) {
                                $parsed = $existingRaw | ConvertFrom-Json
                                if ($parsed -is [System.Array]) {
                                    $inquiriesList = @($parsed)
                                } elseif ($null -ne $parsed) {
                                    $inquiriesList = @($parsed)
                                }
                            }
                        } catch {
                            $inquiriesList = @()
                        }
                    }

                    # Add new inquiry to the top
                    $inquiriesList = @($newInquiry) + @($inquiriesList)
                    $list = @($inquiriesList)
                    if ($list.Count -eq 1) {
                        $jsonOut = "[$($list[0] | ConvertTo-Json -Depth 10)]"
                    } else {
                        $jsonOut = $list | ConvertTo-Json -Depth 10
                    }
                    [System.IO.File]::WriteAllText($inquiriesPath, $jsonOut, [System.Text.Encoding]::UTF8)

                    $respJson = '{"success":true,"message":"Inquiry saved successfully"}'
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $response.ContentLength64 = $respBytes.Length
                    $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
                } else {
                    $response.StatusCode = 400
                }
            } catch {
                $errJson = '{"success":false,"error":"' + $_.Exception.Message.Replace('"', '\"') + '"}'
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # API: Get All Inquiries
        if ($cleanPath -eq "api/get-inquiries") {
            try {
                $inquiriesPath = Join-Path $Directory "inquiries.json"
                $jsonOut = "[]"
                if (Test-Path $inquiriesPath) {
                    $raw = [System.IO.File]::ReadAllText($inquiriesPath, [System.Text.Encoding]::UTF8)
                    if (-not [string]::IsNullOrWhiteSpace($raw)) {
                        $parsed = $raw | ConvertFrom-Json
                        if ($parsed -is [System.Array]) {
                            $jsonOut = $raw
                        } else {
                            $jsonOut = "[$raw]"
                        }
                    }
                }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
            }
            $response.OutputStream.Close()
            continue
        }

        # API: Delete Inquiry
        if ($request.HttpMethod -eq "POST" -and $cleanPath -eq "api/delete-inquiry") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()

                if (-not [string]::IsNullOrWhiteSpace($body)) {
                    $reqObj = $body | ConvertFrom-Json
                    $delId = $reqObj.id
                    $inquiriesPath = Join-Path $Directory "inquiries.json"

                    if (Test-Path $inquiriesPath) {
                        $raw = [System.IO.File]::ReadAllText($inquiriesPath, [System.Text.Encoding]::UTF8)
                        $list = @($raw | ConvertFrom-Json)
                        $filtered = @($list | Where-Object { $_.id -ne $delId })
                        if ($filtered.Count -eq 0) {
                            $jsonOut = "[]"
                        } elseif ($filtered.Count -eq 1) {
                            $jsonOut = "[$($filtered[0] | ConvertTo-Json -Depth 10)]"
                        } else {
                            $jsonOut = $filtered | ConvertTo-Json -Depth 10
                        }
                        [System.IO.File]::WriteAllText($inquiriesPath, $jsonOut, [System.Text.Encoding]::UTF8)
                    }

                    $respJson = '{"success":true,"message":"Inquiry deleted"}'
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $response.ContentLength64 = $respBytes.Length
                    $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
                } else {
                    $response.StatusCode = 400
                }
            } catch {
                $errJson = '{"success":false,"error":"' + $_.Exception.Message.Replace('"', '\"') + '"}'
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # API: Update Inquiry Status
        if ($request.HttpMethod -eq "POST" -and $cleanPath -eq "api/update-inquiry-status") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()

                if (-not [string]::IsNullOrWhiteSpace($body)) {
                    $reqObj = $body | ConvertFrom-Json
                    $targetId = $reqObj.id
                    $newStatus = $reqObj.status
                    $inquiriesPath = Join-Path $Directory "inquiries.json"

                    if (Test-Path $inquiriesPath) {
                        $raw = [System.IO.File]::ReadAllText($inquiriesPath, [System.Text.Encoding]::UTF8)
                        $list = @($raw | ConvertFrom-Json)
                        foreach ($item in $list) {
                            if ($item.id -eq $targetId) {
                                $item | Add-Member -NotePropertyName "status" -NotePropertyValue $newStatus -Force
                            }
                        }
                        if ($list.Count -eq 0) {
                            $jsonOut = "[]"
                        } elseif ($list.Count -eq 1) {
                            $jsonOut = "[$($list[0] | ConvertTo-Json -Depth 10)]"
                        } else {
                            $jsonOut = $list | ConvertTo-Json -Depth 10
                        }
                        [System.IO.File]::WriteAllText($inquiriesPath, $jsonOut, [System.Text.Encoding]::UTF8)
                    }

                    $respJson = '{"success":true,"message":"Status updated"}'
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $response.ContentLength64 = $respBytes.Length
                    $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
                } else {
                    $response.StatusCode = 400
                }
            } catch {
                $errJson = '{"success":false,"error":"' + $_.Exception.Message.Replace('"', '\"') + '"}'
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # Static File Serving
        $urlPath = $cleanPath
        if ([string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "index.html"
        }
        $urlPath = $urlPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $Directory $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) {
                $contentType = "application/octet-stream"
            }

            try {
                $fileInfo = New-Object System.IO.FileInfo($filePath)
                $fileLength = $fileInfo.Length
                $response.ContentType = $contentType
                $response.AddHeader("Accept-Ranges", "bytes")

                if ($ext -eq ".mp4") {
                    $response.AddHeader("Cache-Control", "public, max-age=604800, immutable")
                } elseif ($ext -in @(".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".woff2")) {
                    $response.AddHeader("Cache-Control", "public, max-age=86400")
                } else {
                    $response.AddHeader("Cache-Control", "no-cache")
                }

                $rangeHeader = $request.Headers["Range"]
                $isHead = ($request.HttpMethod -eq "HEAD")

                if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                    $range = $rangeHeader.Substring(6).Split('-')
                    $start = 0L

                    if (-not [string]::IsNullOrWhiteSpace($range[0])) {
                        $start = [long]::Parse($range[0])
                    }

                    if ($range.Length -gt 1 -and -not [string]::IsNullOrWhiteSpace($range[1])) {
                        $end = [long]::Parse($range[1])
                    } else {
                        $end = $fileLength - 1L
                    }

                    if ($end -ge $fileLength) { $end = $fileLength - 1L }
                    if ($start -gt $end) { $start = $end }
                    $contentLength = $end - $start + 1L

                    $response.StatusCode = 206
                    $response.ContentLength64 = $contentLength
                    $response.AddHeader("Content-Range", "bytes $start-$end/$fileLength")

                    if (-not $isHead) {
                        $fs = [System.IO.File]::OpenRead($filePath)
                        try {
                            $fs.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                            $buffer = New-Object byte[] 262144 # 256KB high-throughput buffer
                            $bytesRemaining = $contentLength
                            while ($bytesRemaining -gt 0) {
                                $bytesToRead = [Math]::Min($buffer.Length, [int]$bytesRemaining)
                                $read = $fs.Read($buffer, 0, $bytesToRead)
                                if ($read -le 0) { break }
                                $response.OutputStream.Write($buffer, 0, $read)
                                $bytesRemaining -= $read
                            }
                        } catch {
                            # Client closed connection or scrubbed video - normal behavior
                        } finally {
                            $fs.Close()
                        }
                    }
                } else {
                    $response.StatusCode = 200
                    $response.ContentLength64 = $fileLength

                    if (-not $isHead) {
                        $fs = [System.IO.File]::OpenRead($filePath)
                        try {
                            $buffer = New-Object byte[] 262144
                            while (($read = $fs.Read($buffer, 0, $buffer.Length)) -gt 0) {
                                $response.OutputStream.Write($buffer, 0, $read)
                            }
                        } catch {
                            # Client closed connection - normal behavior
                        } finally {
                            $fs.Close()
                        }
                    }
                }
            } catch {
                try {
                    $response.StatusCode = 500
                } catch {}
            }
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
            $response.ContentLength64 = $msg.Length
            try {
                $response.OutputStream.Write($msg, 0, $msg.Length)
            } catch {}
        }

        try {
            $response.OutputStream.Close()
        } catch {}
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
