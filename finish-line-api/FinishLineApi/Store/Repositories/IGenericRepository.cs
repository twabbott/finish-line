using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Repositories
{
    /// <summary>
    ///     The GenericRepository class implements this interface.  This 
    ///     interface is provided to help mock the GenericRepository class
    ///     for unit testing.
    /// </summary>
    /// <typeparam name="TEntity">
    ///     The type of entity that we want the GenericRepository class to
    ///     contain.
    /// </typeparam>
    public interface IGenericRepository<TEntity>
        where TEntity : class, IEntity
    {
        /// <summary>
        ///     Gets all items.  Use this property to return the entire table.
        /// </summary>
        /// 
        /// <returns>
        ///     A collection of all items
        /// </returns>
        IQueryable<TEntity> All { get; }

        /// <summary>
        ///     Gets a single item by ID
        /// </summary>
        /// 
        /// <param name="id">
        ///     Id for the item you want to fetch.
        /// </param>
        /// 
        /// <returns>
        ///     The indicated item, or throws a NotFoundException.
        /// </returns>
        Task<TEntity> GetByIdAsync(int id);

        /// <summary>
        ///     Creates a new item.
        /// </summary>
        /// 
        /// <param name="entity">
        ///     New entity to add to the database.
        /// </param>
        Task CreateAsync(TEntity entity);

        /// <summary>
        ///     Updates an existing item.  Throws a NotFoundException if the
        ///     item does not exist.
        /// </summary>
        /// 
        /// <param name="entity">
        ///     An entity to update.  Make sure the Id property matches an item
        ///     in the database.
        /// </param>
        Task UpdateAsync(TEntity entity);

        /// <summary>
        ///     Deletes an item in the database.  Throw a NotFoundException if
        ///     the item does not exist.
        /// </summary>
        /// <param name="id">
        ///     An entity to update.  Make sure the Id property matches an item
        ///     in the database.
        /// </param>
        Task DeleteAsync(int id);
    }
}
