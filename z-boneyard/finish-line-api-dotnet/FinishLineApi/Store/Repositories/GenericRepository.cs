﻿using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Repositories
{
    public class GenericRepository<TEntity, TContext> : IGenericRepository<TEntity>
        where TEntity : class, IEntity, new()
    {
        private readonly IGenericDbContext _dbContext;

        public GenericRepository(IGenericDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public IQueryable<TEntity> All
        {
            get
            {
                return _dbContext.Set<TEntity>().AsNoTracking();
            }
        }

        public async Task<TEntity> GetByIdAsync(int id)
        {
            return await All
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task CreateAsync(TEntity entity)
        {
            await _dbContext.Set<TEntity>().AddAsync(entity);
            await SaveChangesAsync();
        }

        public async Task UpdateAsync(TEntity entity)
        {
            _dbContext.Set<TEntity>().Update(entity);
            if (!(await SaveChangesAsync()))
            {
                throw new NotFoundException($"Unable to update {typeof(TEntity)} for id={entity.Id}.");
            }
        }

        public async Task DeleteAsync(int id)
        {
            TEntity stub = new TEntity() { Id = id };
            _dbContext.Set<TEntity>().Remove(stub);
            if (!(await SaveChangesAsync()))
            {
                throw new NotFoundException($"Unable to delete {typeof(TEntity)} for id={id}.");
            }
        }

        private async Task<bool> SaveChangesAsync()
        {
            if (!_dbContext.ChangeTracker.HasChanges())
            {
                return true;
            }

            int count = 0;
            try
            {
                count = await _dbContext.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
            {
                if (!string.IsNullOrEmpty(ex.Message) &&
                    (ex.Message.StartsWith("Database operation expected to affect 1 row(s)") || // This one comes from SQL server
                    ex.Message == "Attempted to update or delete an entity that does not exist in the store.")) // This one comes from EF in-memory db
                    return false;

                throw;
            }

            return count > 0;
        }
    }
}
