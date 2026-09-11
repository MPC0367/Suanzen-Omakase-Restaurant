import CoreImage
import Foundation
// Reads every QR code in an image with macOS's own detector (Core Image).
let path = CommandLine.arguments[1]
guard let img = CIImage(contentsOf: URL(fileURLWithPath: path)) else { print("cannot read \(path)"); exit(2) }
let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
let found = detector.features(in: img).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
print(found.isEmpty ? "NO QR FOUND" : found.joined(separator: "\n"))
