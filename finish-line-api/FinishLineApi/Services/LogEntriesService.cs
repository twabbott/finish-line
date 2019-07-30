using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Entities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FinishLineApi.Services
{
    public interface ILogEntriesService
    {
        IEnumerable<LogEntryDto> ReadAllItems(DateTime? date);
        LogEntryDto ReadItem(int id);
        LogEntryDto CreateItem(LogEntryDto newLogEntry);
        LogEntryDto UpdateItem(LogEntryDto newLogEntry);
        void DeleteItem(int id);
    }

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

        public LogEntryDto CreateItem(LogEntryDto entry)
        {
            LogEntryDtoValidator.ValidateForCreate(entry);

            var entity = _mapper.Map<LogEntry>(entry);
            entity.CreatedDate = DateTime.Now;
            _dbContext.LogEntries.Add(entity);
            _dbContext.CommitChanges();

            return _mapper.Map<LogEntryDto>(entity);
        }

        public LogEntryDto UpdateItem(LogEntryDto entry)
        {
            LogEntryDtoValidator.ValidateForUpdate(entry);

            var entity = _mapper.Map<LogEntry>(entry);
            _dbContext.LogEntries.Update(entity);
            if (_dbContext.CommitChanges() < 1)
            {
                throw new NotFoundException($"Item not found.");
            }

            return _mapper.Map<LogEntryDto>(entity);
        }

        public void DeleteItem(int id)
        {
            LogEntry entity = new LogEntry { Id = id };
            _dbContext.LogEntries.Remove(entity);
            if (_dbContext.CommitChanges() < 1)
            {
                throw new NotFoundException($"Item not found.");
            }
        }
    }
}
