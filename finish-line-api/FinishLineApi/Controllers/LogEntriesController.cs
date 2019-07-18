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
    public class LogEntriesController: ControllerBase
    {
        ILogEntriesService _logEntriesService;
        ILogger<LogEntriesController> _logger;
        
        public LogEntriesController(ILogEntriesService logEntriesService, ILogger<LogEntriesController> logger)
        {
            _logEntriesService = logEntriesService;
            _logger = logger;
        }

        // GET api/v1/log-entries?date=2019-04-23
        [HttpGet]
        [Route("log-entries")]
        public ActionResult<List<LogEntryDto>> GetAll(DateTime? date)
        {
            IEnumerable<LogEntryDto> list;
            try
            {

                list = _logEntriesService.ReadAllItems(date);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "Error getting all LogEntry items");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return Ok(list);
        }

        // GET api/v1/log-entries/{id}
        [HttpGet]
        [Route("log-entries/{id}")]
        public ActionResult<List<LogEntryDto>> Get(int id)
        {
            LogEntryDto logEntry;
            try
            {
                logEntry = _logEntriesService.ReadItem(id);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error getting LogEntry id={id}");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            if (logEntry == null)
            {
                return NotFound();
            }

            return Ok(logEntry);
        }

        // POST api/v1/log-entries/
        [HttpPost]
        [Route("log-entries")]
        public ActionResult<List<LogEntryDto>> Create([FromBody] LogEntryDto newItem)
        {
            LogEntryDto logEntry;
            try
            {
                logEntry = _logEntriesService.CreateItem(newItem);
            }
            catch (ContentValidationException ex)
            {
                return BadRequest(ex.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error creating LogEntry Title=\"{newItem.Title}\"");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return CreatedAtAction(
                "Get",  // Tell WebAPI to use the route-info for our Get() method when creating the location header
                new { id = logEntry.Id }, // Parameters that the Get() method needs
                logEntry); // The new thing that was created.
        }

        [HttpPut]
        [Route("log-entries/{id}")]
        public ActionResult<LogEntryDto> Update(int id, [FromBody] LogEntryDto item)
        {
            LogEntryDto logEntry;
            try
            {
                if (item.Id > 0 && item.Id != id)
                {
                    throw new ContentValidationException("'id' property must match URL");
                }

                logEntry = _logEntriesService.UpdateItem(item);
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
                _logger.LogCritical(ex, $"Error updating LogEntry Id={id} Title=\"{item.Title}\"");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return Ok(logEntry);
        }

        [HttpDelete]
        [Route("log-entries/{id}")]
        public ActionResult Delete(int id)
        {
            try
            {
                _logEntriesService.DeleteItem(id);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error deleting LogEntry Id={id}");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return NoContent();
        }
    }
}
