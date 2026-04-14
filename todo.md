1、updateKeywordInUrl中为什么不需要传入updateurl来防止闭包
2、app/(client)/(no-tabbar)/hotels/components/HotelCard.tsx这个组件为什么要加displayname，而且用usememo包裹而别的组件不用？
3、app/admin/hotels/page.tsx是不是因为传递了函数才必须声明成客户端组件的？是不是改成server action会更好？
4、app/admin/layout.tsx里面的判断逻辑和middleware是否重叠？
5、对于这个项目修改成server action有什么建议，鉴权和组件部分详细说明