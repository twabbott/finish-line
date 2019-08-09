using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Models;
using FinishLineApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FinishLineApi.Controllers
{
    [Route("api/v1")]
    [ApiController]
    public class WorkNotesController: ControllerBase
    {
        IWorkNoteService _workNoteService;
        ILogger<WorkNotesController> _logger;
        
        public WorkNotesController(IWorkNoteService workNoteService, ILogger<WorkNotesController> logger)
        {
            _workNoteService = workNoteService;
            _logger = logger;
        }

        // GET api/v1/work-notes?date=2019-04-23
        [HttpGet]
        [Route("work-notes")]
        public ActionResult<List<WorkNoteDto>> GetAll(DateTime? date)
        {
            IEnumerable<WorkNoteDto> list;
            try
            {

                list = _workNoteService.ReadAllItems(date);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "Error getting all WorkNote items");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return Ok(list);
        }

        // GET api/v1/work-notes/{id}
        [HttpGet]
        [Route("work-notes/{id}")]
        public ActionResult<List<WorkNoteDto>> Get(int id)
        {
            WorkNoteDto workNote;
            try
            {
                workNote = _workNoteService.ReadItem(id);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error getting WorkNote id={id}");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            if (workNote == null)
            {
                return NotFound();
            }

            return Ok(workNote);
        }

        // POST api/v1/work-notes/
        [HttpPost]
        [Route("work-notes")]
        public ActionResult<List<WorkNoteDto>> Create([FromBody] WorkNoteDto newItem)
        {
            WorkNoteDto workNote;
            try
            {
                workNote = _workNoteService.CreateItem(newItem);
            }
            catch (ContentValidationException ex)
            {
                return BadRequest(ex.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error creating WorkNote Title=\"{newItem.Title}\"");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return CreatedAtAction(
                "Get",  // Tell WebAPI to use the route-info for our Get() method when creating the location header
                new { id = workNote.Id }, // Parameters that the Get() method needs
                workNote); // The new thing that was created.
        }

        [HttpPut]
        [Route("work-notes/{id}")]
        public ActionResult<WorkNoteDto> Update(int id, [FromBody] WorkNoteDto item)
        {
            WorkNoteDto workNote;
            try
            {
                if (item.Id > 0 && item.Id != id)
                {
                    throw new ContentValidationException("'id' property must match URL");
                }

                workNote = _workNoteService.UpdateItem(item);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Errors);
            }
            catch (ContentValidationException ex)
            {
                return BadRequest(ex.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error updating WorkNote Id={id} Title=\"{item.Title}\"");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return Ok(workNote);
        }

        [HttpDelete]
        [Route("work-notes/{id}")]
        public ActionResult Delete(int id)
        {
            try
            {
                _workNoteService.DeleteItem(id);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error deleting WorkNote Id={id}");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return NoContent();
        }
    }
}
