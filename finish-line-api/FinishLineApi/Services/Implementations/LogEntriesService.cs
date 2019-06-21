using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.Models;
using FinishLineApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Services.Implementations
{
    public class LogEntriesService: ILogEntriesService
    {
        private IFinishLineDBContext _dbContext;
        private IMapper _mapper;

        public LogEntriesService(IFinishLineDBContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public IEnumerable<LogEntryDto> ReadAll(DateTime? date)
        {
            var query = _dbContext.WorkItems as IQueryable<LogEntry>;
            if (date.HasValue)
            {
                query = query.Where(item => item.CreatedDate == date);
            }

            var results = query.ToList();

            return _mapper.Map<IEnumerable<LogEntryDto>>(results);
        }
    }
}
