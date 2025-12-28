using Homecare.DTO;
using Homecare.Model;
using Homecare.Repository;
using Homecare.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Homecare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DicomController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IImageServices _imageServices;

        public DicomController(IUnitOfWork unitOfWork, IImageServices imageServices)
        {
            _unitOfWork = unitOfWork;
            _imageServices = imageServices;
        }

        [HttpPost("upload")]
        [Authorize]
        public async Task<IActionResult> UploadDicomFile([FromForm] DicomFileCreateDto dicomDto)
        {
            try
            {
                // Validate patient and physician exist
                var patient = await _unitOfWork.Patients.FindAsync(p => p.Id == dicomDto.PatientId, Array.Empty<string>());
                if (patient == null)
                    return NotFound("Patient not found");

                var physician = await _unitOfWork.Physicians.FindAsync(p => p.Id == dicomDto.PhysicianId, Array.Empty<string>());
                if (physician == null)
                    return NotFound("Physician not found");

                // Validate file
                if (dicomDto.File == null || dicomDto.File.Length == 0)
                    return BadRequest("No file uploaded");

                // Check file type (DICOM files typically don't have standard extensions)
                var allowedTypes = new[] { "application/octet-stream", "application/dicom" };
                if (!allowedTypes.Contains(dicomDto.File.ContentType.ToLower()) &&
                    !dicomDto.File.FileName.ToLower().EndsWith(".dcm") &&
                    !dicomDto.File.FileName.ToLower().EndsWith(".dicom"))
                {
                    // Allow any file for now, but log the content type
                    Console.WriteLine($"DICOM upload with content type: {dicomDto.File.ContentType}");
                }

                if (dicomDto.File.Length > 50 * 1024 * 1024) // 50MB limit
                    return BadRequest("File size must be less than 50MB");

                // Create uploads directory if it doesn't exist
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "dicom");
                Directory.CreateDirectory(uploadsDir);

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}_{dicomDto.File.FileName}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dicomDto.File.CopyToAsync(stream);
                }

                // Create DICOM file record
                var dicomFile = new DicomFile
                {
                    PatientId = dicomDto.PatientId,
                    PhysicianId = dicomDto.PhysicianId,
                    FileName = fileName,
                    OriginalFileName = dicomDto.File.FileName,
                    FilePath = filePath,
                    FileSize = dicomDto.File.Length,
                    ContentType = dicomDto.File.ContentType,
                    Notes = dicomDto.Notes
                };

                await _unitOfWork.DicomFiles.AddAsync(dicomFile);
                await _unitOfWork.SaveDbAsync();

                // Return formatted response for frontend
                var response = new
                {
                    id = dicomFile.Id.ToString(),
                    fileName = dicomFile.OriginalFileName,
                    fileUrl = $"/uploads/dicom/{dicomFile.FileName}",
                    uploadedAt = dicomFile.CreatedAt.ToString("O")
                };

                return CreatedAtAction(nameof(GetDicomFile), new { id = dicomFile.Id }, response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetDicomFile(int id)
        {
            var dicomFile = await _unitOfWork.DicomFiles.FindAsync(d => d.Id == id,
                new[] { nameof(DicomFile.Patient), nameof(DicomFile.Physician), nameof(DicomFile.Annotations) });

            if (dicomFile == null)
                return NotFound("DICOM file not found");

            var dicomDto = new DicomFileSendDto
            {
                Id = dicomFile.Id,
                PatientId = dicomFile.PatientId,
                PatientName = dicomFile.Patient.Name,
                PhysicianId = dicomFile.PhysicianId,
                PhysicianName = dicomFile.Physician.Name,
                FileName = dicomFile.FileName,
                OriginalFileName = dicomFile.OriginalFileName,
                FileSize = dicomFile.FileSize,
                UploadDate = dicomFile.UploadDate,
                StudyInstanceUID = dicomFile.StudyInstanceUID,
                Modality = dicomFile.Modality,
                BodyPart = dicomFile.BodyPart,
                StudyDescription = dicomFile.StudyDescription,
                AnalysisStatus = dicomFile.AnalysisStatus,
                AIAnalysisResult = dicomFile.AIAnalysisResult,
                ConfidenceScore = dicomFile.ConfidenceScore,
                AnalysisDate = dicomFile.AnalysisDate,
                Notes = dicomFile.Notes,
                CreatedAt = dicomFile.CreatedAt,
                UpdatedAt = dicomFile.UpdatedAt,
                Annotations = dicomFile.Annotations.Select(a => new DicomAnnotationSendDto
                {
                    Id = a.Id,
                    DicomFileId = a.DicomFileId,
                    PhysicianId = a.PhysicianId,
                    PhysicianName = a.Physician.Name,
                    AnnotationType = a.AnnotationType,
                    AnnotationData = a.AnnotationData,
                    Description = a.Description,
                    CreatedDate = a.CreatedDate,
                    ModifiedDate = a.ModifiedDate,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt
                }).ToList()
            };

            return Ok(dicomDto);
        }

        [HttpGet("patient/{patientId}")]
        [Authorize]
        public async Task<IActionResult> GetPatientDicomFiles(int patientId)
        {
            var dicomFiles = _unitOfWork.DicomFiles.FindAll(d => d.PatientId == patientId,
                new[] { nameof(DicomFile.Patient), nameof(DicomFile.Physician) })
                .Where(d => System.IO.File.Exists(d.FilePath)) // Only return files that actually exist on disk
                .OrderByDescending(d => d.UploadDate);

            var dicomDtos = dicomFiles.Select(dicomFile => new DicomFileSendDto
            {
                Id = dicomFile.Id,
                PatientId = dicomFile.PatientId,
                PatientName = dicomFile.Patient.Name,
                PhysicianId = dicomFile.PhysicianId,
                PhysicianName = dicomFile.Physician.Name,
                FileName = dicomFile.FileName,
                OriginalFileName = dicomFile.OriginalFileName,
                FileSize = dicomFile.FileSize,
                UploadDate = dicomFile.UploadDate,
                Modality = dicomFile.Modality,
                BodyPart = dicomFile.BodyPart,
                StudyDescription = dicomFile.StudyDescription,
                AnalysisStatus = dicomFile.AnalysisStatus,
                AIAnalysisResult = dicomFile.AIAnalysisResult,
                ConfidenceScore = dicomFile.ConfidenceScore,
                AnalysisDate = dicomFile.AnalysisDate,
                Notes = dicomFile.Notes,
                CreatedAt = dicomFile.CreatedAt,
                UpdatedAt = dicomFile.UpdatedAt
            });

            return Ok(dicomDtos);
        }

        [HttpGet("download/{id}")]
        [Authorize]
        public async Task<IActionResult> DownloadDicomFile(int id)
        {
            var dicomFile = await _unitOfWork.DicomFiles.FindAsync(d => d.Id == id, Array.Empty<string>());

            if (dicomFile == null)
                return NotFound("DICOM file not found");

            if (!System.IO.File.Exists(dicomFile.FilePath))
                return NotFound("File not found on disk");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(dicomFile.FilePath);
            return File(fileBytes, "application/octet-stream", dicomFile.OriginalFileName);
        }

        [HttpPost("{dicomFileId}/annotation")]
        [Authorize]
        public async Task<IActionResult> AddAnnotation(int dicomFileId, [FromBody] DicomAnnotationCreateDto annotationDto)
        {
            var dicomFile = await _unitOfWork.DicomFiles.FindAsync(d => d.Id == dicomFileId, Array.Empty<string>());
            if (dicomFile == null)
                return NotFound("DICOM file not found");

            // Get current user (physician)
            var physicianIdClaim = User.FindFirst("PhysicianId")?.Value;
            if (string.IsNullOrEmpty(physicianIdClaim) || !int.TryParse(physicianIdClaim, out int physicianId))
                return Unauthorized("Physician ID not found in token");

            var physician = await _unitOfWork.Physicians.FindAsync(p => p.Id == physicianId, Array.Empty<string>());
            if (physician == null)
                return NotFound("Physician not found");

            var annotation = new DicomAnnotation
            {
                DicomFileId = dicomFileId,
                PhysicianId = physicianId,
                AnnotationType = annotationDto.AnnotationType,
                AnnotationData = annotationDto.AnnotationData,
                Description = annotationDto.Description
            };

            await _unitOfWork.DicomAnnotations.AddAsync(annotation);
            await _unitOfWork.SaveDbAsync();

            return CreatedAtAction(nameof(GetDicomFile), new { id = dicomFileId }, annotation);
        }

        [HttpPut("annotation/{annotationId}")]
        [Authorize]
        public async Task<IActionResult> UpdateAnnotation(int annotationId, [FromBody] DicomAnnotationCreateDto annotationDto)
        {
            var annotation = await _unitOfWork.DicomAnnotations.FindAsync(a => a.Id == annotationId,
                new[] { nameof(DicomAnnotation.Physician) });

            if (annotation == null)
                return NotFound("Annotation not found");

            // Check if current user owns this annotation
            var physicianIdClaim = User.FindFirst("PhysicianId")?.Value;
            if (string.IsNullOrEmpty(physicianIdClaim) || !int.TryParse(physicianIdClaim, out int physicianId))
                return Unauthorized("Physician ID not found in token");

            if (annotation.PhysicianId != physicianId)
                return Forbid("You can only edit your own annotations");

            annotation.AnnotationType = annotationDto.AnnotationType;
            annotation.AnnotationData = annotationDto.AnnotationData;
            annotation.Description = annotationDto.Description;
            annotation.ModifiedDate = DateTime.UtcNow;
            annotation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.DicomAnnotations.UpdateById(annotation);
            await _unitOfWork.SaveDbAsync();

            return Ok(annotation);
        }

        [HttpDelete("annotation/{annotationId}")]
        [Authorize]
        public async Task<IActionResult> DeleteAnnotation(int annotationId)
        {
            var annotation = await _unitOfWork.DicomAnnotations.FindAsync(a => a.Id == annotationId, Array.Empty<string>());

            if (annotation == null)
                return NotFound("Annotation not found");

            // Check if current user owns this annotation
            var physicianIdClaim = User.FindFirst("PhysicianId")?.Value;
            if (string.IsNullOrEmpty(physicianIdClaim) || !int.TryParse(physicianIdClaim, out int physicianId))
                return Unauthorized("Physician ID not found in token");

            if (annotation.PhysicianId != physicianId)
                return Forbid("You can only delete your own annotations");

            _unitOfWork.DicomAnnotations.RemoveById(annotation.Id);
            await _unitOfWork.SaveDbAsync();

            return NoContent();
        }

        // Frontend API compatibility endpoints
        [HttpPost("analyze/{dicomId}")]
        [Authorize]
        public async Task<IActionResult> AnalyzeDicom(string dicomId)
        {
            var dicomFile = await _unitOfWork.DicomFiles.FindAsync(
                f => f.Id.ToString() == dicomId,
                new[] { nameof(DicomFile.Patient), nameof(DicomFile.Physician) });

            if (dicomFile == null)
                return NotFound("DICOM file not found");

            // Check if user has access to this file
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _unitOfWork.ApplicationUsers.FindAsync(u => u.Id == userId, Array.Empty<string>());
            if (user == null) return Unauthorized();

            bool hasAccess = false;
            if (User.IsInRole("Admin"))
            {
                hasAccess = true;
            }
            else if (User.IsInRole("Physician"))
            {
                hasAccess = user.PhysicianId != null && user.PhysicianId == dicomFile.PhysicianId;
            }
            else if (User.IsInRole("Patient"))
            {
                hasAccess = user.PatientId != null && user.PatientId == dicomFile.PatientId;
            }

            if (!hasAccess)
                return Forbid("You don't have access to this DICOM file");

            // Simulate AI analysis (in production, this would call an AI service)
            var analysis = new DicomAnalysisResult
            {
                DicomFileId = dicomFile.Id,
                AnalysisType = "AI Analysis",
                Result = "Analysis completed successfully",
                AnalysisDate = DateTime.UtcNow,
                FileName = dicomFile.OriginalFileName,
                Findings = "AI analysis completed. No significant abnormalities detected in the imaging study.",
                Confidence = 0.92,
                Recommendations = "Follow up with physician for detailed interpretation. Consider additional imaging if symptoms persist.",
                AnalyzedAt = DateTime.UtcNow,
                PhysicianId = dicomFile.PhysicianId,
                PatientId = dicomFile.PatientId
            };

            // Save analysis result (you might want to store this in database)
            // For now, we'll just return it

            return Ok(analysis);
        }

        [HttpGet("analyses")]
        [Authorize]
        public async Task<IActionResult> GetAnalyses()
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _unitOfWork.ApplicationUsers.FindAsync(u => u.Id == userId, Array.Empty<string>());
            if (user == null) return Unauthorized();

            IEnumerable<DicomFile> dicomFiles;
            if (User.IsInRole("Admin"))
            {
                dicomFiles = await _unitOfWork.DicomFiles.FindAll(f => true, new[] { nameof(DicomFile.Patient), nameof(DicomFile.Physician) }).ToListAsync();
            }
            else if (User.IsInRole("Physician"))
            {
                if (user.PhysicianId == null) return NotFound("Physician not found");
                dicomFiles = await _unitOfWork.DicomFiles.FindAll(
                    f => f.PhysicianId == user.PhysicianId,
                    new[] { nameof(DicomFile.Patient), nameof(DicomFile.Physician) }).ToListAsync();
            }
            else if (User.IsInRole("Patient"))
            {
                if (user.PatientId == null) return NotFound("Patient not found");
                dicomFiles = await _unitOfWork.DicomFiles.FindAll(
                    f => f.PatientId == user.PatientId,
                    new[] { nameof(DicomFile.Patient), nameof(DicomFile.Physician) }).ToListAsync();
            }
            else
            {
                return Forbid();
            }

            // Generate mock analysis results for each DICOM file
            var analyses = dicomFiles.Select(f => new DicomAnalysisResult
            {
                DicomFileId = f.Id,
                AnalysisType = "AI Analysis",
                Result = "Analysis completed successfully",
                AnalysisDate = DateTime.UtcNow,
                FileName = f.OriginalFileName,
                Findings = $"Analysis completed for {f.OriginalFileName}. Normal findings observed.",
                Confidence = 0.88,
                Recommendations = "Routine follow-up recommended.",
                AnalyzedAt = DateTime.UtcNow.AddDays(-1),
                PhysicianId = f.PhysicianId,
                PatientId = f.PatientId
            });

            return Ok(analyses);
        }
    }
}