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
using FluentValidation;
using FluentValidation.AspNetCore;

namespace FinishLineApi.Controllers
{
    [Route("api/v1")]
    [ApiController]
    public class LogEntriesController: ControllerBase
    {
        ILogEntriesService _logEntriesService;
        ILogger<LogEntriesController> _logger;
        IMapper _mapper;

        public LogEntriesController(ILogEntriesService logEntriesService, ILogger<LogEntriesController> logger, IMapper mapper)
        {
            _logEntriesService = logEntriesService;
            _logger = logger;
            _mapper = mapper;
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
            var validator = new LogEntryDtoValidator();
            var results = validator.Validate(newItem, ruleSet: "Create");
            if (!results.IsValid)
            {
                results.AddToModelState(ModelState, null);
                return BadRequest(ModelState);
            }

            LogEntryDto logEntry;
            try
            {
                logEntry = _logEntriesService.CreateItem(newItem);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, $"Error creating LogEntry Title=\"{newItem.Title}\"");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return Created(
                $"{Request.Path}/{logEntry.Id}",
                logEntry);
        }
    }
}
