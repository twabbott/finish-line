using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Repositories
{
    /// <summary>
    ///     Exception thrown by the GenericRepository class on update or delete
    ///     if the item was not found.
    /// </summary>
    public class NotFoundException: Exception
    {
        /// <summary>
        ///     Creates a new NotFoundException object.
        /// </summary>
        /// 
        /// <param name="message">
        ///     Message should indicate the id.
        /// </param>
        public NotFoundException(string message) : base(message)
        { }
    }
}
