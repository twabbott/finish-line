using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinishLineApi.DTO;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FinishLineApi.Controllers
{
    [Route("api/v1")]
    [ApiController]
    public class FolderController : ControllerBase
    {
        IFolderService _folderService;
        ILogger _logger;

        public FolderController(IFolderService folderService, ILogger logger)
        {
            _folderService = folderService;
            _logger = logger;
        }

        [HttpGet]
        [Route("folders/{folderId:int?}")]
        public async Task<ActionResult<FolderInfoDto>> GetFolderInfoAsync(int? folderId = null)
        {
            FolderInfoDto folderInfo = null;
            try
            {
                folderInfo = await _folderService.ReadItemAsync(folderId);
            }
            catch (Exception ex)
            {
                if (folderId != null)
                {
                    _logger.LogCritical(ex, $"Error getting content for folder id={folderId}.");
                }
                else
                {
                    _logger.LogCritical(ex, $"Error getting content for root folder.");
                }

                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            if (folderInfo == null)
            {
                return NotFound();
            }

            return Ok(await Task.FromResult(folderInfo));
        }

        [HttpPost]
        [Route("folders")]
        public async Task<ActionResult<FolderInfoDto>> CreateFolderAsync([FromBody] FolderInfoDto newItem)
        {
            FolderInfoDto folderInfo;
            try
            {
                folderInfo = await _folderService.CreateItemAsync(newItem);
            }
            catch (ContentValidationException ex)
            {
                return BadRequest(ex.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error creating FolderInfo Name=\"{newItem?.Folder?.Name}\"");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return CreatedAtAction(
                "GetFolderInfoAsync",  // Tell WebAPI to use the route-info for our GetAsync() method when creating the location header
                new { id = folderInfo.Folder.Id }, // Parameters that the GetAsync() method needs
                folderInfo); // The new thing that was created.
        }
    }
}
