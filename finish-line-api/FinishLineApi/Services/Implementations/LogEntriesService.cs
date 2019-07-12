using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Models;
using FinishLineApi.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Services
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

        public IEnumerable<LogEntryDto> ReadAllItems(DateTime? date)
        {
            var query = _dbContext.LogEntries as IQueryable<LogEntry>;
            if (date.HasValue)
            {
                query = query.Where(item => item.CreatedDate.Date == date.Value.Date);
            }

            var results = query.ToList();

            return _mapper.Map<IEnumerable<LogEntryDto>>(results);
        }

        public LogEntryDto ReadItem(int id)
        {
            var query = _dbContext.LogEntries.Where(item => item.Id == id);
            var result = query.ToList().SingleOrDefault();
            return _mapper.Map<LogEntryDto>(result);
        }

        public LogEntryDto CreateItem(LogEntryDto newLogEntry)
        {
            var entity = _mapper.Map<LogEntry>(newLogEntry);
            entity.CreatedDate = DateTime.Now;
            _dbContext.LogEntries.Add(entity);
            _dbContext.CommitChanges();

            return _mapper.Map<LogEntryDto>(entity);
        }
    }
}
