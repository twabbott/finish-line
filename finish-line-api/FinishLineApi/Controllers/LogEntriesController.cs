using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.Models;
using FinishLineApi.Services.Interfaces;
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
        IMapper _mapper;


        public LogEntriesController(ILogEntriesService logEntriesService, ILogger<LogEntriesController> logger, IMapper mapper)
        {
            _logEntriesService = logEntriesService;
            _logger = logger;
            _mapper = mapper;
        }

        // GET api/v1/log-entries?date=2019-04-23
        [HttpGet]
        [Route("log-entries?date={date:DateTime}")]
        public ActionResult<List<LogEntryDto>> GetAll(DateTime? date)
        {
            IEnumerable<LogEntryDto> list;
            try
            {
                list = _logEntriesService.ReadAll(date);
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "Error getting all TODO items");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }

            return Ok(list);
        }
    }
}
