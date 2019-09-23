using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Repositories
{
    /// <summary>
    ///     All entities in your DB Context must be tagged with this interface.
    /// </summary>
    public interface IEntity
    {
        /// <summary>
        ///     Primary key for the record.
        /// </summary>
        int Id { get; set; }
    }
}
